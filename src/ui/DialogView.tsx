import './../style/Dialog.scss';

type DialogViewProps = {
  visible: boolean;
  title: string;
  text: string;
  canContinue: boolean;
  onContinue: () => void;
};

export function DialogView({ visible, title, text, canContinue, onContinue }: DialogViewProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className='dialog-window' onClick={onContinue}>
      <div className='dialog-title'>{title}</div>
      <div className='dialog-text'>{text}</div>

      {canContinue && (
        <button className='dialog-continue' type='button' onClick={onContinue}>
          ▼
        </button>
      )}
    </div>
  );
}
