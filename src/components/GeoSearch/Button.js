import React from 'preact-compat';
import PropTypes from 'prop-types';

const Button = ({ className, disabled, onClick, children }) => (
  <button className={className} onClick={onClick} disabled={disabled}>
    {children}
  </button>
);

Button.propTypes = {
  className: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
};

Button.defaultProps = {
  disabled: false,
};

export default Button;
