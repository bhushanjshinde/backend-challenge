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
  const apps = appsRepository.getAllApps();

  let liveReasons = {}; // To store the reason for each app

  let appUrlToIdMap = {};
  for (let app of apps) {
    appUrlToIdMap[app.url] = app.id;
  }

  // Check each campaign to see if it makes an app live.
  for (let campaign of campaigns) {
    if (campaign.status === 'running') {
      let appId = appUrlToIdMap[campaign.redirect_url];
      if (appId) {
        liveReasons[appId] = `App ${appId} is LIVE because campaign ${campaign.campaign_id} links to it and is running.`;
      }
    }
  }

  // Check each app's links to see if they make any other apps live.
  for (let app of apps) {
    if (liveReasons[app.id]) {
      for (let link of app.links) {
        let linkedAppId = appUrlToIdMap[link];
        if (linkedAppId && !liveReasons[linkedAppId]) {
          liveReasons[linkedAppId] = `App ${linkedAppId} is LIVE because App ${app.id} is live and links to App ${linkedAppId}`;
        }
      }
    }
  }

  // Print for each app from the first app. ToDo - Save object
  for (let app of apps) {
    console.log(liveReasons[app.id] || `App ${app.id} is NOT LIVE`);
  }
}

calculateIsLive();

//ToDo - logs only onSave or log while traversing