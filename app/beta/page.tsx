import BetaClient from './BetaClient';

export const metadata = {
  title: 'Beta Test Instructions | BizarreBeasts',
  description: 'Beta tester instructions and access information',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function BetaPage() {
  return <BetaClient />;
}
