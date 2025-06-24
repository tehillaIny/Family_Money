import React from "react";
import { useData } from "@/hooks/useData.jsx";
import { exportTransactionsToCsv } from "@/lib/utils.js";
import { Button } from '@/components/ui/button.jsx';

const CsvExportButton = ({
  className = '',
  variant = 'outline',
  children = 'Export CSV',
  data,
  filename = 'export.csv',
  headers,
  ...props
}) => {
  const { transactions } = useData();
  const exportData = data || transactions;

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={() => exportTransactionsToCsv(exportData, filename, headers)}
      disabled={!exportData.length}
      aria-disabled={!exportData.length}
      {...props}
    >
      {children}
    </Button>
  );
};

export default CsvExportButton;