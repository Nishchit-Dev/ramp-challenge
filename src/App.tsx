import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  // Data
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()

  // flags
  const [isLoading, setIsLoading] = useState(false)
  const [viewMoreFlag, setViewMoreFlag] = useState(false)
  const hashmap = new Map()
  // coutners
  const [pageCount, setPageCount] = useState(0)

  const transactions = useMemo(() => {
    console.log("checking...")
    console.log(paginatedTransactions,transactionsByEmployee)
    return paginatedTransactions?.data ?? transactionsByEmployee ?? null
  }, [paginatedTransactions, transactionsByEmployee])

  const MaxPages = useMemo(() => paginatedTransactions?.nextPage ?? -1, [paginatedTransactions])

  const loadAllEmployee = useCallback(async () => {
    await employeeUtils.fetchAll(hashmap)
    setIsLoading(false)
  }, [employees])

  const loadAllTransactions = useCallback(async () => {
    setViewMoreFlag(false)
    transactionsByEmployeeUtils.invalidateData()
    await paginatedTransactionsUtils.fetchAll(hashmap)
    setViewMoreFlag(true)
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      setViewMoreFlag(false)
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
      setViewMoreFlag(true)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    setIsLoading(true)
    loadAllEmployee()
  }, [])

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            } else {
              if (newValue.id === "") {
                await loadAllTransactions()
                setPageCount(0)
              } else {
                await loadTransactionsByEmployee(newValue.id)
              }
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />
          {transactions !== null && viewMoreFlag && pageCount < MaxPages && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadAllTransactions()
                setPageCount((prev) => {
                  return prev + 1
                })
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
