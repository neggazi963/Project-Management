import { Link, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Loader, XCircle } from "lucide-react";
import { Button } from "@base-ui/react/button";
import { useVerifyEmailMutation } from "@/hooks/use-auth";
import { toast } from "sonner";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [isSuccess, setIsSuccess] = useState(false);
  const { mutate, isPending: isVerifying } = useVerifyEmailMutation();

  useEffect(() => {
    if (token) {
      mutate(
        { token },
        {

          onSuccess: () => {
            setIsSuccess(true);
          },
          onError: (error: any) => {
            error.response?.data?.message || "An error occurred";
            setIsSuccess(false);
            console.log(error);

            toast.error(error.message);
          },
        },
      );
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Verify Email</h1>
      <p className="text-sm text-gray-500">Verifying your email...</p>

      <Card>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6">
            {isVerifying ? (
              <>
                <Loader className="w-10 h-10 text-gray-500 animate-spin" />
                <h3 className="text-lg font-semibold">Verifying email...</h3>
                <p className="text-sm text-gray-500">
                  Please wait while we verify your email
                </p>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle className="w-10 h-10 text-green-500" />
                <h3 className="text-lg font-semibold">Email Verified</h3>
                <p className="text-sm text-gray-500">
                  Your email has been verified successfully
                </p>
                <Link to="/sign-in" className="text-sm text-blue-500 mt-6">
                  <Button>Back to Sign In</Button>
                </Link>
              </>
            ) : (
              <>
                <XCircle className="w-10 h-10 text-red-500" />
                <h3 className="text-lg font-semibold">
                  Email Verification Failed
                </h3>
                <p className="text-sm text-gray-500">
                  Your email verification failed. Please try again.
                </p>
                <Link to="/sign-in" className="text-sm text-blue-500 mt-6">
                  <Button>Back to Sign In</Button>
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default VerifyEmail;
