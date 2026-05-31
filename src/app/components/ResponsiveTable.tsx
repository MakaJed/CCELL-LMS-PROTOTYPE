import { ReactNode } from 'react';
import { Card } from './ui/card';
import { motion } from 'motion/react';

interface ResponsiveTableProps {
  headers: string[];
  data: any[];
  renderRow: (item: any, index: number) => ReactNode;
  emptyMessage?: string;
  className?: string;
}

export function ResponsiveTable({
  headers,
  data,
  renderRow,
  emptyMessage = 'No data available',
  className = '',
}: ResponsiveTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className={`w-full ${className}`}>
          <thead>
            <tr className="border-b-2 border-gray-200">
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="text-left py-3 px-4 font-semibold text-sm text-gray-700 bg-gray-50"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <motion.tr
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                {renderRow(item, index)}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="p-4 hover:shadow-md transition-shadow">
              {renderRow(item, index)}
            </Card>
          </motion.div>
        ))}
      </div>
    </>
  );
}
