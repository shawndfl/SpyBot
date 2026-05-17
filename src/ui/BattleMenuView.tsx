import type { BattleMenuOption } from '../components/BattleMenuComponent';
import './../style/BattleMenu.scss';

type BattleMenuViewProps = {
  visible: boolean;
  options: BattleMenuOption[];
  selectedIndex: number;
  onHover: (index: number) => void;
  onSelect: (option: BattleMenuOption) => void;
};

const labels: Record<BattleMenuOption, string> = {
  attack: 'Attack',
  special: 'Special',
  item: 'Items',
};

export function BattleMenuView({ visible, options, selectedIndex, onHover, onSelect }: BattleMenuViewProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className='battle-menu'>
      <div className='battle-menu__title'>Choose Action</div>

      <div className='battle-menu__options'>
        {options.map((option, index) => (
          <button
            key={option}
            className={
              index === selectedIndex ? 'battle-menu__button battle-menu__button--selected' : 'battle-menu__button'
            }
            onMouseEnter={() => onHover(index)}
            onClick={() => onSelect(option)}
          >
            <span className='battle-menu__cursor'>{index === selectedIndex ? '▶' : ''}</span>

            {labels[option]}
          </button>
        ))}
      </div>
    </div>
  );
}
