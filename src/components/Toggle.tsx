interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-[18px] w-[34px] shrink-0 rounded-full transition-colors duration-150"
      style={{ backgroundColor: checked ? '#4f8cff' : '#4a4a4a' }}
    >
      <span
        className="absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white transition-all duration-150"
        style={{ left: checked ? 18 : 2 }}
      />
    </button>
  )
}
