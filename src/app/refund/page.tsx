import React from 'react';

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Refund Policy</h1>
        
        <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
          <p>Last updated: {new Date().toLocaleDateString()}</p>

          <section className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-100 dark:border-red-800">
            <h2 className="text-xl font-bold mb-3 text-red-800 dark:text-red-400">Important Notice: No Refunds on Digital Products</h2>
            <p className="font-semibold text-red-700 dark:text-red-300">
              Please read this policy carefully before making a purchase.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">1. Digital Products Policy</h2>
            <p>
              Little Skylark Tutorial sells intangible, irrevocable digital goods. We do not issue refunds once the order is accomplished and the product access information is sent. As a customer, you are responsible for understanding this upon purchasing any item at our site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">2. All Sales Are Final</h2>
            <p>
              Due to the immediate nature of digital delivery, <strong>all sales are final and non-refundable</strong>. Unlike physical goods, digital products cannot be returned. Once you have purchased access to our tutorials, you have full access to our intellectual property, and we cannot retrieve that access.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">3. Exceptional Circumstances</h2>
            <p>
              We realize that exceptional circumstances can take place with regard to the character of the product we supply. Therefore, we DO honor requests for the refund on the following reasons:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <strong>Non-delivery of the product:</strong> due to some mailing issues of your e-mail provider or your own mail server you might not receive a delivery e-mail from us. In this case, we recommend contacting us for assistance.
              </li>
              <li>
                <strong>Major defects:</strong> although all the products are thoroughly tested before release, unexpected errors may occur. Such issues must be reported to our technical support team.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">4. Contact Us</h2>
            <p>
              If you have any questions about our Refund Policy, please contact us before making a purchase.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
