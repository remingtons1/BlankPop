export default function CheckoutCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center p-8 max-w-md">
        <div className="text-6xl mb-6">&#10005;</div>
        <h1 className="text-3xl font-bold mb-4 text-red-400">Checkout Cancelled</h1>
        <p className="text-gray-300 mb-6">
          Your order was not completed. No payment has been processed.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          If you experienced any issues, please try again or contact support.
        </p>
        <a
          href="/"
          className="inline-block bg-gray-600 hover:bg-gray-500 text-white font-semibold px-6 py-3 rounded-lg transition"
        >
          Back to BlankPop
        </a>
      </div>
    </div>
  );
}
