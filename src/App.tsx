import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Employee } from "./utils/types";
import { InputSelect } from "./components/InputSelect";
import { TransactionPane } from "./components/TransactionPane";
import { Instructions } from "./components/Instructions";
import { useEmployees } from "./hooks/useEmployees";
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions";
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee";
import { EMPTY_EMPLOYEE } from "./utils/constants";

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees();
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } =
    usePaginatedTransactions();
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } =
    useTransactionsByEmployee();
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<any>(null);

  console.log("paginatedTransactions = ", paginatedTransactions);
  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  );

  const [oldTransactions, setOldTransactions] = useState<any>([]);

  useEffect(() => {
    let deepData: any = [...oldTransactions];
    if (transactions !== null) {
      transactions.forEach((item) => {
        deepData.push(item);
      });
    }
    setOldTransactions(deepData);
  }, [transactions]);

  useEffect(() => {
    if (transactionsByEmployee) {
      setOldTransactions(transactionsByEmployee);
    }
  }, [transactionsByEmployee]);

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true);
    transactionsByEmployeeUtils.invalidateData();

    await employeeUtils.fetchAll();
    setIsLoading(false);
    await paginatedTransactionsUtils.fetchAll();
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils]);

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData();
      await transactionsByEmployeeUtils.fetchById(employeeId);
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  );

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions();
    }
  }, [employeeUtils.loading, employees, loadAllTransactions]);

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading && !employees}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (!newValue?.id) {
              setCurrentEmployeeId(null);
              setOldTransactions([]);
              loadAllTransactions();
              return;
            }

            if (newValue === null) {
              setCurrentEmployeeId(null);
              return;
            }
            setCurrentEmployeeId(newValue.id);
            await loadTransactionsByEmployee(newValue.id);
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          {transactions === null ? (
            <div className="RampLoading--container">Loading...</div>
          ) : (
            <Fragment>
              <div data-testid="transaction-container">
                {oldTransactions.map((transaction: any) => (
                  <TransactionPane
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))}
              </div>
              {paginatedTransactions &&
                paginatedTransactions.nextPage != null &&
                currentEmployeeId === null && (
                  <button
                    className="RampButton"
                    disabled={paginatedTransactionsUtils.loading}
                    onClick={async () => {
                      await loadAllTransactions();
                    }}
                  >
                    View More
                  </button>
                )}
            </Fragment>
          )}
        </div>
      </main>
    </Fragment>
  );
}
