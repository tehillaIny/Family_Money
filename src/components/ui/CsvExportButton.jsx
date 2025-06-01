import React from "react";
import { useData } from "@/hooks/useData.jsx";
import { exportTransactionsToCsv } from "@/lib/utils.js";

const CsvExportButton = () => {
  const { transactions } = useData();

  return (
    <button
  onClick={() => exportTransactionsToCsv(transactions)}
  className="btn btn-secondary"
  disabled={!transactions.length}
  aria-disabled={!transactions.length}
>
  Export CSV
</button>
  );
};

export default CsvExportButton;