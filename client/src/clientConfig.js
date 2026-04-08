const isProduction = process.env.NODE_ENV === 'production';
const productionSocketURI = (process.env.REACT_APP_SERVER_URI || '').trim();

const config = {
  isProduction,
  hasSocketServerConfigured: !isProduction || Boolean(productionSocketURI),
  contentfulSpaceId: process.env.REACT_APP_CONTENTFUL_SPACE_ID,
  contentfulAccessToken: process.env.REACT_APP_CONTENTFUL_ACCESS_TOKEN,
  socketURI:
    isProduction
      ? productionSocketURI || null
      : `http://${window.location.hostname}:5001/`,
};

export default config;