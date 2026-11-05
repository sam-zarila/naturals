// app/api/paystack/verify/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';

type CourierOrder = {
  shippingMethod?: string;
  shippingStatus?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      province?: string;
      postalCode?: string;
    } | null;
  };
};

function zoneForProvince(province: string) {
  const zones: Record<string, string> = {
    'eastern-cape': 'EC', 'free-state': 'FS', gauteng: 'GP',
    'kwa-zulu-natal': 'KZN', limpopo: 'LP', mpumalanga: 'MP',
    'northern-cape': 'NC', 'north-west': 'NW', 'western-cape': 'WC',
  };
  return zones[province] || province.toUpperCase();
}

async function createCourierShipment(orderId: string, order: CourierOrder) {
  const token = process.env.COURIER_GUY_API_KEY;
  if (!token) throw new Error('COURIER_GUY_API_KEY is not configured');

  const address = order.customer?.address;
  if (!address?.line1 || !address.city || !address.province || !address.postalCode) {
    throw new Error('The order is missing a complete delivery address');
  }

  const baseUrl = (process.env.COURIER_GUY_API_BASE_URL || 'https://api.portal.thecourierguy.co.za/v2').replace(/\/$/, '');
  const senderName = process.env.COURIER_GUY_SENDER_NAME || 'Delightful Naturals';
  const senderEmail = process.env.COURIER_GUY_SENDER_EMAIL || process.env.CONTACT_EMAIL || '';
  const senderPhone = process.env.COURIER_GUY_SENDER_PHONE || '';
  const senderStreet = process.env.COURIER_GUY_SENDER_STREET || '';
  const senderCity = process.env.COURIER_GUY_SENDER_CITY || '';
  const senderProvince = process.env.COURIER_GUY_SENDER_PROVINCE || '';
  const senderPostalCode = process.env.COURIER_GUY_SENDER_POSTAL_CODE || '';

  if (!senderEmail || !senderPhone || !senderStreet || !senderCity || !senderProvince || !senderPostalCode) {
    throw new Error('Courier sender address/contact environment variables are incomplete');
  }

  const payload = {
    collection_address: {
      street_address: senderStreet, city: senderCity, zone: senderProvince,
      code: senderPostalCode, country: 'South Africa', type: 'business',
      entered_address: `${senderStreet}, ${senderCity}, ${senderPostalCode}, South Africa`,
    },
    collection_contact: { name: senderName, email: senderEmail, mobile_number: senderPhone },
    delivery_address: {
      street_address: address.line1,
      ...(address.line2 ? { local_area: address.line2 } : {}),
      city: address.city, zone: zoneForProvince(address.province), code: address.postalCode,
      country: 'South Africa', type: 'residential',
      entered_address: [address.line1, address.line2, address.city, address.postalCode, 'South Africa'].filter(Boolean).join(', '),
    },
    delivery_contact: {
      name: order.customer?.name || 'Customer', email: order.customer?.email || '',
      mobile_number: order.customer?.phone || '',
    },
    parcels: [{
      submitted_length_cm: process.env.COURIER_GUY_PARCEL_LENGTH_CM || '30',
      submitted_width_cm: process.env.COURIER_GUY_PARCEL_WIDTH_CM || '20',
      submitted_height_cm: process.env.COURIER_GUY_PARCEL_HEIGHT_CM || '10',
      submitted_weight_kg: process.env.COURIER_GUY_PARCEL_WEIGHT_KG || '1',
      parcel_description: 'Delightful Naturals products',
      alternative_tracking_reference: orderId,
    }],
    service_level_code: process.env.COURIER_GUY_SERVICE_LEVEL || 'ECO',
  };

  const response = await fetch(`${baseUrl}/shipments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.id) {
    console.error('Courier Guy shipment error:', { status: response.status, data });
    throw new Error(data?.message || 'Courier shipment creation failed');
  }
  return data;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const reference = url.searchParams.get('reference');
    if (!reference) {
      return NextResponse.json({ message: 'Missing reference' }, { status: 400 });
    }

   const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message || 'Verify failed' },
        { status: 500 }
      );
    }

    if (data?.status === true && data?.data?.status === 'success') {
      const orderId = data.data?.metadata?.orderId;
      if (orderId) {
        const orderRef = db.collection('orders').doc(String(orderId));
        const orderSnap = await orderRef.get();
        if (orderSnap.exists) {
          const order = orderSnap.data() as CourierOrder;
          const paymentUpdate: Record<string, unknown> = {
            status: 'paid', paymentReference: reference, paidAt: new Date(),
          };
          if (order.shippingMethod === 'the-courier-guy' && order.shippingStatus !== 'booked') {
            try {
              const shipment = await createCourierShipment(String(orderId), order);
              paymentUpdate.shippingStatus = 'booked';
              paymentUpdate.courier = {
                shipmentId: shipment.id,
                trackingReference: shipment.custom_tracking_reference || shipment.tracking_reference || null,
                status: shipment.status || 'submitted',
              };
            } catch (courierError) {
              console.error('Courier booking failed:', courierError);
              paymentUpdate.shippingStatus = 'booking_failed';
              paymentUpdate.shippingError = courierError instanceof Error ? courierError.message : 'Courier booking failed';
            }
          }
          await orderRef.update(paymentUpdate);
        }
      }
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
