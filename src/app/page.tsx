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
  commerceWidget1:
    | checkout.Widget<typeof checkout.WidgetType.IMMUTABLE_COMMERCE>
    | undefined;
  commerceWidget2:
    | checkout.Widget<typeof checkout.WidgetType.IMMUTABLE_COMMERCE>
    | undefined;
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

  const [commerceWidget1, setCommerceWidget1] =
    useState<checkout.Widget<typeof checkout.WidgetType.IMMUTABLE_COMMERCE>>();
  const [commerceWidget2, setCommerceWidget2] =
    useState<checkout.Widget<typeof checkout.WidgetType.IMMUTABLE_COMMERCE>>();

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

      const commerceWidget1 = widgetsFactory.create(
        checkout.WidgetType.IMMUTABLE_COMMERCE,
        {}
      );
      setCommerceWidget1(commerceWidget1);

      const commerceWidget2 = widgetsFactory.create(
        checkout.WidgetType.IMMUTABLE_COMMERCE,
        {}
      );
      setCommerceWidget2(commerceWidget2);
    })();
  }, []);

  return (
    <commerceContext.Provider
      value={{
        passportClient,
        widgetsFactory,
        commerceWidget1,
        commerceWidget2,
      }}
    >
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
  id,
  widget,
  params,
}: {
  id: string;
  widget:
    | checkout.Widget<typeof checkout.WidgetType.IMMUTABLE_COMMERCE>
    | undefined;
  params: checkout.CommerceWidgetParams;
}) => {
  useEffect(() => {
    if (!widget) return;
    widget.mount(id, params);
    widget.addListener(checkout.CommerceEventType.CLOSE, () => {
      console.log({id, x: 'close'});
    });
    return () => {
      console.log("unmounting...");
      widget.unmount();
    };
  }, [params, widget]);

  return (
    <>
      <div id={id} />
    </>
  );
};

function Thang() {
  const { passportClient } = useCommerce();
  const queryParams = useSearchParams();
  const { commerceWidget1, commerceWidget2 } = useCommerce();

  useEffect(() => {
    if (!queryParams.has("code")) return;
    passportClient.loginCallback();
  }, [passportClient, queryParams]);

  return (
    <>
    <p>1</p>
      {commerceWidget1 && (
        <CommerceWidget
          id="no-thanks-1"
          widget={commerceWidget1}
          params={{ flow: checkout.CommerceFlowType.SWAP, amount: "1" }}
        />
      )}
    <p>2</p>
      {commerceWidget2 && (
        <CommerceWidget
          id="no-thanks-2"
          widget={commerceWidget2}
          params={{ flow: checkout.CommerceFlowType.SWAP, amount: "1" }}
        />
      )}
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
