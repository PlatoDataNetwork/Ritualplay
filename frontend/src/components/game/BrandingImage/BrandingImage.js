import React from 'react'
import './BrandingImage.scss'
import avatar from './../../../assets/game/avatar.png'

export const BrandingImage = () => {
  return (
    <div className="BrandingImage">
      <img className="img-brand" src={avatar} alt="Brand avatar" />
    </div>
  )
}

export default BrandingImage
