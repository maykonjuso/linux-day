import { redirect } from 'next/navigation';

/** O QR code aponta para /j/<codigo>. Hoje só redireciona para o deck. */
export default async function Join({ params }: { params: Promise<{ code: string }> }) {
  await params;
  redirect('/');
}
