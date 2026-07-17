import { resetPasswordSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Link, useSearchParams, useNavigate } from "react-router";
import { z } from "zod";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { ArrowLeft, CheckCircle, Loader2, XCircle } from "lucide-react";
import { useResetPasswordMutation } from "@/hooks/use-auth";
import { toast } from "sonner";

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const { mutate, isPending } = useResetPasswordMutation();

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleOnSubmit = (values: ResetPasswordFormData) => {
    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }

    mutate(
      {
        token,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
          toast.success("Password reset successfully");
          setTimeout(() => navigate("/sign-in"), 2000);
        },
        onError: (error: any) => {
          const errorMessage = error.response?.data?.message || error.message;
          console.log(error);
          toast.error(errorMessage);
        },
      },
    );
  };

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-2 py-6">
            <XCircle className="w-10 h-10 text-red-500" />
            <h3 className="text-lg font-semibold">Invalid Reset Link</h3>
            <p className="text-sm text-muted-foreground">
              This password reset link is invalid or has expired.
            </p>
            <Link
              to="/forgot-password"
              className="text-sm text-blue-500 mt-4 hover:underline"
            >
              Request a new link
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="text-center mb-5">
          <Link
            to="/sign-in"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:underline mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to sign in</span>
          </Link>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>

        <CardContent>
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center text-center space-y-2 py-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
              <h3 className="text-lg font-semibold">
                Password reset successful
              </h3>
              <p className="text-sm text-muted-foreground">
                Redirecting you to sign in...
              </p>
            </div>
          ) : (
            <form
              onSubmit={form.handleSubmit(handleOnSubmit)}
              className="space-y-4"
            >
              <Controller
                name="newPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>New Password</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="password"
                      placeholder="••••••••"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="confirmPassword"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Confirm Password
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="password"
                      placeholder="••••••••"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ResetPassword;
