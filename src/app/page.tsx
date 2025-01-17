"use client";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { checkout, config, passport } from "@imtbl/sdk";
import { useSearchParams } from "next/navigation";
export type CommerceContext = {
  passportClient: passport.Passport;
  widgetsFactory: checkout.IWidgetsFactory | undefined;
  commerceWidget: checkout.Widget<typeof checkout.WidgetType.IMMUTABLE_COMMERCE> | undefined;
};

const commerceContext = createContext<CommerceContext | null>(null);
const baseConfig = { environment: config.Environment.SANDBOX };

function CommerceProvider({ children }: PropsWithChildren) {
  const [passportClient] = useState<passport.Passport>(
    () =>
      new passport.Passport({
        baseConfig,
        clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
        redirectUri: "http://localhost:3000",
      })
  );

  const [widgetsFactory, setWidgetsFactory] =
    useState<checkout.IWidgetsFactory>();

  const [commerceWidget, setCommerceWidget] = useState<checkout.Widget<typeof checkout.WidgetType.IMMUTABLE_COMMERCE>>();

  useEffect(() => {
    (async () => {
      console.log({ ui: await passportClient.getUserInfo() });
      const checkoutSDK = new checkout.Checkout({
        passport: passportClient,
        baseConfig,
      });
      const widgetsFactory = await checkoutSDK.widgets({
        config: {
          theme: checkout.WidgetTheme.DARK,
        },
      });
      setWidgetsFactory(widgetsFactory);
      const commerceWidget = widgetsFactory.create(checkout.WidgetType.IMMUTABLE_COMMERCE, { });
      setCommerceWidget(commerceWidget);
    })();
  }, []);

  return (
    <commerceContext.Provider value={{ passportClient, widgetsFactory, commerceWidget }}>
      {children}
    </commerceContext.Provider>
  );
}

const useCommerce = () => {
  const context = useContext(commerceContext);
  if (!context) {
    throw new Error("useCommerce must be used within a CommerceProvider");
  }
  return context;
};

export const CommerceWidget = ({
  params,
}: {
  params: checkout.CommerceWidgetParams;
}) => {
  const { commerceWidget } = useCommerce();

  useEffect(() => {
    console.log(params.flow)
    console.log({ commerceWidget, params });
    if (!commerceWidget) return;
    commerceWidget.mount("no-thanks", params);
    return () => {
      console.log("unmounting...");
      commerceWidget.unmount();
    };
  }, [params, commerceWidget]);

  return <div id="no-thanks" />;
};

function Thang() {
  const { passportClient } = useCommerce();
  const queryParams = useSearchParams();
  const [showWidget, setShowWidget] = useState(false);

  useEffect(() => {
    if (!queryParams.has("code")) return;
    passportClient.loginCallback();
  }, [passportClient, queryParams]);

  return (
    <>
      <button
        onClick={() => {
          setShowWidget(true);
        }}
      >
        Show
      </button>
      {showWidget ? (
        <CommerceWidget params={{ flow: checkout.CommerceFlowType.SWAP, amount: "1" }} />
      ) : null}
    </>
  );
}

export default function Home() {
  return (
    <CommerceProvider>
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
          <Thang />
        </main>
      </div>
    </CommerceProvider>
  );
}
