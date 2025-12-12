import ConditionalLayout from "../../components/ConditionalLayout";

export default function ChromeLayout({ children }) {
  return (
    <ConditionalLayout>
      {children}
    </ConditionalLayout>
  );
}