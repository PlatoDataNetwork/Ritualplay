import React from 'react';
import PropTypes from 'prop-types';
import chipImg from '../../assets/game/rollplay_green.png'


const ChipsAmountPill = ({ chipsAmount }) => {
  return (
    <div className="chip-amount-pill">
      <img className="chip-amount-img" src={chipImg} alt="Chip" />
      <span className="chip-amount-text">{chipsAmount}</span>
    </div>
  );
};

ChipsAmountPill.propTypes = {
  chipsAmount: PropTypes.number,
};

export default ChipsAmountPill;
