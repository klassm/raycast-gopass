import { Action, ActionPanel, closeMainWindow, Icon, List } from "@raycast/api";
import { useEffect, useState } from "react";
import { autotype } from "../autotype";
import { AccountDetails, accountDetails } from "../gopass";

const useData = (key: string) => {
  const [data, setData] = useState<AccountDetails | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    accountDetails(key)
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
};

export function AccountDetail({ accountKey }: { accountKey: string }) {
  const { data, loading } = useData(accountKey);
  const entries = Object.entries(data?.values ?? {}) ?? [];
  return (
    <List isLoading={loading} enableFiltering={true} searchBarPlaceholder={accountKey} throttle>
      {entries.map((entry) => {
        if (data === undefined) {
          return <></>;
        }
        return <GopassKeyValue key={entry[0]} entryKey={entry[0]} entryValue={entry[1]} details={data} />;
      })}
    </List>
  );
}

function GopassKeyValue({
  entryKey,
  entryValue,
  details,
}: {
  entryKey: string;
  entryValue: string;
  details: AccountDetails;
}) {
  return (
    <List.Item
      title={entryKey}
      icon={{ source: Icon.Key }}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action
              title="Autotype"
              onAction={async () => {
                await closeMainWindow();
                await autotype(details, entryKey);
              }}
            />
            <Action.CopyToClipboard title="Copy value" content={entryValue} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
