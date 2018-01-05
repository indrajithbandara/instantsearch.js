import React from 'preact-compat';
import cx from 'classnames';
import Template from '../Template';
import Button from './Button';
import Toggle from './Toggle';

const Control = ({
  cssClasses,
  enableRefineControl,
  enableClearMapRefinement,
  isRefineOnMapMove,
  isRefinedWithMap,
  hasMapMoveSinceLastRefine,
  toggleRefineOnMapMove,
  refineWithMap,
  clearMapRefinement,
  templateProps,
}) => (
  <div>
    {enableRefineControl && (
      <div className={cssClasses.control}>
        {isRefineOnMapMove || !hasMapMoveSinceLastRefine ? (
          <Toggle
            classNameLabel={cx(
              cssClasses.toggleLabel,
              isRefineOnMapMove && cssClasses.toggleLabelActive
            )}
            classNameInput={cssClasses.toggleInput}
            checked={isRefineOnMapMove}
            onToggle={toggleRefineOnMapMove}
          >
            <Template {...templateProps} templateKey="toggle" />
          </Toggle>
        ) : (
          <Button
            className={cssClasses.redo}
            disabled={!hasMapMoveSinceLastRefine}
            onClick={refineWithMap}
          >
            <Template {...templateProps} templateKey="redo" />
          </Button>
        )}
      </div>
    )}

    {!enableRefineControl &&
      !isRefineOnMapMove && (
        <div className={cssClasses.control}>
          <Button
            className={cssClasses.redo}
            disabled={!hasMapMoveSinceLastRefine}
            onClick={refineWithMap}
          >
            <Template {...templateProps} templateKey="redo" />
          </Button>
        </div>
      )}

    {enableClearMapRefinement &&
      isRefinedWithMap && (
        <Button className={cssClasses.clear} onClick={clearMapRefinement}>
          <Template {...templateProps} templateKey="clear" />
        </Button>
      )}
  </div>
);

export default Control;
