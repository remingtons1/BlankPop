export default function CheckoutSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center p-8 max-w-md">
        <div className="text-6xl mb-6">&#10003;</div>
        <h1 className="text-3xl font-bold mb-4 text-green-400">Payment Successful!</h1>
        <p className="text-gray-300 mb-6">
          Thank you for your order. We&apos;ve received your payment and will start creating your custom merchandise.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          You&apos;ll receive an email confirmation with tracking info once your order ships.
        </p>
        <a
          href="/"
          className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg transition"
        >
          Back to BlankPop
        </a>
      </div>
    </div>
  );
}
