"use client";

import CalendlyScheduler from "@/components/support-service/CalendlyScheduler";
import RequestCall from "@/components/support-service/RequestCall";

export default function SupportServiceContent() {
  return (
    <main className="bg-gray-50 p-3 sm:p-4 md:p-6">
      <section className="mx-auto w-full max-w-5xl space-y-6 sm:space-y-8">
        <header className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Contact Us
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            {`We'd love to hear from you. Choose the best way to get in touch.`}
          </p>
        </header>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <RequestCall />
            <div className="rounded-2xl border bg-white p-4 sm:p-6 text-center shadow-sm">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                General Phone
              </h3>
              <a
                href="tel:+18884915131"
                className="text-lg sm:text-xl text-blue-600 hover:text-blue-700 font-medium inline-block py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors touch-manipulation"
              >
                888-491-5131
              </a>
            </div>
            <div className="rounded-2xl border bg-white p-4 sm:p-6 text-center shadow-sm">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                General Email
              </h3>
              <a
                href="mailto:Info@cegunited.com"
                className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium inline-block py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors break-all touch-manipulation"
              >
                Info@cegunited.com
              </a>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 sm:p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                Schedule One-on-One Consulting
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                Book a personalized consulting session with one of our experts.
              </p>
            </div>

            <CalendlyScheduler />
            <p className="text-xs text-gray-500 mt-3 sm:mt-4">
              After scheduling, we automatically record your booking in our
              system.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
