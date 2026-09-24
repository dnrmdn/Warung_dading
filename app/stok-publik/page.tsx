import { redirect, RedirectType } from 'next/navigation';

export default function StokPublikRedirectPage() {
  redirect('/', RedirectType.replace);
}
