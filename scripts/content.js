
let lastUrl = location.href;

const observer = new MutationObserver(() => {
  const url = location.href;

  // init on route change
  if (url !== lastUrl) {
    if (url.includes(lastUrl)) { // avoid multiple init - happens at some popups
      return;
    }
    lastUrl = url;

    if (lastUrl.includes('linkedin.com/in')
      || lastUrl.includes('linkedin.com/company')) {
      init();
    }
  }
});

observer.observe(document, {
  subtree: true,
  childList: true,
});


async function main() {

  const totalCryptoStatusPromise = getTotalCryptoStatus(location.href);

  const startNode = await findStartNode();

  const targetNode = await findTargetNode(startNode);

  const totalCryptoStatus = await totalCryptoStatusPromise;

  if (targetNode.nextSibling.className !== 'crypto-status') { // avoid duplicate appending
    targetNode.after(totalCryptoStatus);
  }
}

async function getTotalCryptoStatus(url) {
  const checkmarkImageSource = chrome.runtime.getURL('/images/circle-orange-checkmark.png');
  const hicoinyLogoSource = chrome.runtime.getURL('/images/hicoiny-logo.png');

  // It should be later something like:
  //  const profileData = await fetch('https://hicoiny.com/api/profile/crypteel').then(res => res.json());
  // For now, we will use a mock data
  const profileData = {
    btc: 14.75,
    usd: "972939",
    profileUrl: 'https://hicoiny.com/profile/crypteel',
  };

  let htmlTemplate = await ((await fetch(chrome.runtime.getURL('/html-templates/crypto-status.html'))).text());
  htmlTemplate = htmlTemplate.replace('${checkmarkImageSource}', checkmarkImageSource);
  htmlTemplate = htmlTemplate.replace('${hicoinyLogoSource}', hicoinyLogoSource);
  htmlTemplate = htmlTemplate.replace('${profileUrl}', profileData.profileUrl);
  htmlTemplate = htmlTemplate.replace('${btc}', Number(profileData.btc).toFixed(4));
  htmlTemplate = htmlTemplate.replace('${usd}', Number(profileData.usd).toLocaleString());

  const htmlElement = document.createElement('div');
  htmlElement.innerHTML = htmlTemplate;
  htmlElement.className = htmlElement.firstChild.className; // = 'crypto-status';
  return htmlElement;
}

function findStartNode() {

  return new Promise((resolve) => {
    const elementChecker = setInterval(checkForElement, 250);
    let counter = 0;

    function checkForElement() {
      counter += 1;

      if (counter > 60) {
        console.log('Target HTML Node not found after ' + counter + ' attempts');
        clearInterval(elementChecker);
      }

      const startNode = document.querySelector("#profile-content, .profile") // for profile page
        || document.querySelector(".organization-outlet, #main-content"); // for company page


      if (startNode) {
        resolve(startNode);
        console.log('Start HTML Node', startNode);
        clearInterval(elementChecker);
      }
    }
  });

}

async function findTargetNode(startNode) {
  return new Promise((resolve) => {
    const elementChecker = setInterval(checkForElement, 250);
    let counter = 0;

    function checkForElement() {
      counter += 1;

      if (counter > 60) {
        console.log('Target HTML Node not found after ' + counter + ' attempts');
        clearInterval(elementChecker);
      }
      const targetNode = startNode.querySelector('[class*=" pv-text-details__right-panel"], [class^="pv-text-details__right-panel"]')
        || startNode.querySelector('[class*=" pv-text-details__left-panel"], [class^="pv-text-details__left-panel"]')
        || startNode.querySelector('[class*=" org-top-card-summary"],  [class^="org-top-card-summary"]') // for company page
        || startNode.querySelector('[class*=" org-organizational-page-admin-navigation__follower"],  [class^="org-organizational-page-admin-navigation__follower"]') // for company page
        || startNode.querySelector('[class*=" top-card-layout__headline"],  [class^="top-card-layout__headline"]'); // when user is not logged in

      if (targetNode) {
        resolve(targetNode);
        console.log('Target HTML Node Found', targetNode);
        clearInterval(elementChecker);
      }
    }
  });
}


main();