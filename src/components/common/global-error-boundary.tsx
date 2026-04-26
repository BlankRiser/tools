import React from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { Button } from "../ui/button";

type Props = {
  children: React.ReactNode;
};

export const GlobalErrorBoundary = ({ children }: Props) => {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <GlobalErrorBoundaryFallback error={error} reset={resetErrorBoundary} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

type GlobalErrorBoundaryFallbackProps = {
  error: FallbackProps["error"];
  reset: FallbackProps["resetErrorBoundary"];
};

const GlobalErrorBoundaryFallback: React.FC<GlobalErrorBoundaryFallbackProps> = ({
  error,
  reset,
}) => {
  return (
    <section>
      <h3>Something went wrong!</h3>
      <pre>{JSON.stringify(error)}</pre>
      <div>
        <Button onClick={reset}>Try again</Button>
      </div>
    </section>
  );
};
