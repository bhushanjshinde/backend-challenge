const campaignRepository = require("./repositories/campaign-repository");
const appsRepository = require("./repositories/apps-repository");

/**
 * An app is live if it's linked to a campaigns that is live,
 * OR
 * if it's linked to another live app (i.e. appears on the other app links).
 *
 * This function calculates for each app if it's live or not,
 * and sets the is_live property accordingly.
 *
 * if the is_live status calculated from this function is different than what is currently saved in the database, the new status needs to be saved in the db by using the repository function:
 * appsRepository.saveApp(app)
 *
 */

async function calculateIsLive() {
  const campaigns = await campaignRepository.getAllCampaigns();

  const liveCampaignUrls = new Set(campaigns.filter(campaign => campaign.status === 'running').map(campaign => campaign.redirect_url));
  // Live apps by running campaign urls
  const initialLiveApps = appsRepository.getAllApps().filter(app => liveCampaignUrls.has(app.url));

  while (initialLiveApps.length > 0) {
    let currentApp = initialLiveApps.shift();

    if (!currentApp.is_live) {
      currentApp.is_live = true;
      appsRepository.saveApp(currentApp);

      for (const linkedUrl of currentApp.links) {
        const linkedApps = appsRepository.getAppsByUrl(linkedUrl);
        for (const linkedApp of linkedApps) {
          if (!linkedApp.is_live) {
            initialLiveApps.push(linkedApp);
          }
        }
      }
    }
  }
}

calculateIsLive();