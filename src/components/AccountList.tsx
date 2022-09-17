import { Action, ActionPanel, closeMainWindow, Icon, List, showToast, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";
import { autotype } from "../autotype";
import { accountDetails, GopassAccount, listAccounts, openEditor } from "../gopass";
import { AccountDetail } from "./AccountDetail";

const useData = () => {
  const [data, setData] = useState<GopassAccount[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    listAccounts()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

export function AccountList() {
  const { data, loading } = useData()

  return (
    <List isLoading={ loading } enableFiltering={ true }
          searchBarPlaceholder="Search Gopass..." throttle>
      { ( data ?? [] ).map((entry) => (
        <GopassListDetail key={ entry.accountKey } entry={ entry }/>
      )) }
    </List>
  );
}

async function autotypeAccount(account: GopassAccount) {
  const details = await accountDetails(account.accountKey);
  const autotypeValue = details.values.autotype;
  if (!autotypeValue) {
    await showToast({ title: 'Autotyping failed', message: `Cannot find autotype key in ${ account.accountKey }` })
  } else {
    await closeMainWindow()
    await autotype(details, "autotype");
  }
}

function GopassListDetail({ entry }: { entry: GopassAccount }) {
  const path = entry.path.reverse().join(" ⬅ ");
  const { push } = useNavigation();

  return (
    <List.Item
      title={ entry.name }
      subtitle={ path }
      icon={ { source: Icon.Key } }
      actions={ (
        <ActionPanel>
          <ActionPanel.Section>
            <Action title="Open" onAction={ () => {
              push(<AccountDetail accountKey={ entry.accountKey }/>)
            } }></Action>
            <Action title="Autotype" onAction={ async () => {
              await autotypeAccount(entry);
            } }></Action>
            <Action title="Edit" onAction={ async () => {
              await closeMainWindow();
              await openEditor(entry.accountKey);
            } }></Action>
          </ActionPanel.Section>
        </ActionPanel>
      ) }
    />
  );
}

