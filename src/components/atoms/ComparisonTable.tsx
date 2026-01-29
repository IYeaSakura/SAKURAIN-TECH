import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useInView } from '@/hooks/useScrollProgress';
import { Check, X } from 'lucide-react';

interface ComparisonRow {
  dimension: string;
  traditional: string;
  sakurain: string;
  difference: string;
}

interface ComparisonTableProps {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: ComparisonRow[];
}

export function ComparisonTable({ title, subtitle, headers, rows }: ComparisonTableProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { threshold: 0.1 });

  return (
    <div ref={ref} className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-4">{title}</h2>
          {subtitle && <p className="text-lg text-[#6b7280]">{subtitle}</p>}
        </motion.div>

        {/* Table */}
        <motion.div
          className="overflow-x-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-[#2563eb]">
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className={`py-4 px-4 text-left font-semibold text-[#111827] ${
                      index === 0 ? 'w-[15%]' : index === 3 ? 'w-[35%]' : 'w-[25%]'
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <motion.tr
                  key={rowIndex}
                  className="border-b border-black/5 hover:bg-[#fafafa] transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, delay: 0.1 * rowIndex }}
                >
                  <td className="py-5 px-4">
                    <span className="font-semibold text-[#111827]">{row.dimension}</span>
                  </td>
                  <td className="py-5 px-4 text-[#6b7280]">
                    <div className="flex items-start gap-2">
                      <X size={16} className="text-red-400 mt-1 shrink-0" />
                      <span>{row.traditional}</span>
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    <div className="flex items-start gap-2">
                      <Check size={16} className="text-[#10b981] mt-1 shrink-0" />
                      <span className="font-medium text-[#2563eb]">{row.sakurain}</span>
                    </div>
                  </td>
                  <td className="py-5 px-4 text-sm text-[#6b7280]">
                    {row.difference}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
}
