import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Tabs = ({ tabs, activeTab, onChange, variant = 'pills' }) => {
  if (variant === 'underline') {
    return (
      <div className="flex gap-0 border-b border-tech-surface">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={twMerge(
              clsx(
                'flex items-center gap-2 px-6 py-3 text-[0.625rem] font-black tracking-[0.2em] uppercase transition-all duration-200 border-b-2 -mb-[1px]',
                activeTab === tab.value
                  ? 'border-tech-cyan text-tech-cyan'
                  : 'border-transparent text-tech-muted hover:text-tech-text',
              ),
            )}
          >
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="inline-flex bg-tech-primary/50 rounded-xl p-1 border border-tech-surface shadow-inner">
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={twMerge(
            clsx(
              'flex items-center gap-2 px-6 py-2.5 rounded-lg text-[0.625rem] font-black tracking-[0.2em] uppercase transition-all duration-200',
              activeTab === tab.value
                ? 'bg-tech-cyan text-white shadow-lg'
                : 'text-tech-muted hover:text-tech-text',
            ),
          )}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
