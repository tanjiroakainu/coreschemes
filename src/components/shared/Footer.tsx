import Header from './Header';

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-white py-4 sm:py-6 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <Header />
        <p className="mt-2 sm:mt-4 text-xs sm:text-sm text-neutral-400">
          © 2024 TGP. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
