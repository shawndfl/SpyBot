import './../style/Crosshair.scss';

export function CrosshairView() {
  return (
    <div className='crosshair' aria-hidden='true'>
      <span className='crosshair__line crosshair__line--top' />
      <span className='crosshair__line crosshair__line--right' />
      <span className='crosshair__line crosshair__line--bottom' />
      <span className='crosshair__line crosshair__line--left' />
    </div>
  );
}
