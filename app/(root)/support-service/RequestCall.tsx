import { CustomFormField } from "@/components/CustomFormField";
import { Form } from "@/components/ui/form";
import { useContactUsMutation } from "@/hooks/contact-us";
import { type RequestCall, requestCallSchema } from "@/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

const RequestCall = () => {
  const { requestCall, isRequesting } = useContactUsMutation();

  const form = useForm<RequestCall>({
    resolver: zodResolver(requestCallSchema),
    defaultValues: {
      status: "New",
    },
  });

  const onSubmit: SubmitHandler<RequestCall> = useCallback(
    async (values) => {
      await requestCall({ values });
      form.reset();
    },
    [form, requestCall]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <fieldset disabled={isRequesting}>
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Request Customer Service Call
            </h2>
            <p className="text-gray-600 mb-4">
              {`Need immediate assistance? Submit a request and we'll call you back.`}
            </p>

            <CustomFormField name={"fullName"} placeholder={""} label="* Full Name" />
            <div className="grid grid-cols-2 gap-4">
              <CustomFormField name={"email"} type="email" placeholder="" label="* Email Address" />
              <CustomFormField name={"phoneNumber"} placeholder="" label="* Phone Number" />
            </div>

            <CustomFormField
              name={"message"}
              placeholder=""
              label="* Message"
              type="textarea"
              className="mb-4"
            />

            <button
              type="submit"
              disabled={isRequesting}
              className="w-full rounded-xl bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isRequesting ? "Submitting..." : "Request a Call"}
            </button>
          </div>
        </fieldset>
      </form>
    </Form>
  );
};

export default RequestCall;
