import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRIENDS_FILE = path.join(__dirname, '../public/data/friends.json');

const TIMEOUT = 10000;
const MAX_RETRIES = 2;

function getBuildTimestamp() {
  const now = new Date();
  return now.toISOString();
}

function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isDateBefore(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1 < d2;
}

function checkUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;

    const options = {
      method: 'HEAD',
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    };

    const req = protocol.request(url, options, (res) => {
      req.destroy();

      const isSuccess = res.statusCode >= 200 && res.statusCode < 400;
      resolve({
        success: isSuccess,
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
      });
    });

    req.on('error', (error) => {
      req.destroy();
      resolve({
        success: false,
        error: error.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Timeout',
      });
    });

    req.end();
  });
}

async function checkUrlWithRetry(url, retries = MAX_RETRIES) {
  for (let i = 0; i <= retries; i++) {
    try {
      const result = await checkUrl(url);

      if (result.success) {
        return { success: true, status: 'online' };
      }

      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  return { success: false, status: 'offline' };
}

async function checkFriendsConnectivity() {
  try {
    const content = fs.readFileSync(FRIENDS_FILE, 'utf-8');
    const data = JSON.parse(content);

    if (!data.friends || !Array.isArray(data.friends)) {
      console.error('Invalid friends.json structure');
      return;
    }

    console.log(`Checking connectivity for ${data.friends.length} friends...`);

    const results = [];
    const unidirectionalFriends = [];

    for (const friend of data.friends) {
      if (!friend.url) {
        console.warn(`Skipping friend ${friend.id}: no URL`);
        continue;
      }

      process.stdout.write(`Checking ${friend.id}... `);

      const result = await checkUrlWithRetry(friend.url);

      if (result.success) {
        console.log('✓ Online');
        friend.status = 'online';
        if (friend.offlineSince) {
          delete friend.offlineSince;
        }
      } else {
        console.log('✗ Offline');
        friend.status = 'offline';
        const today = getTodayDate();
        if (!friend.offlineSince) {
          friend.offlineSince = today;
        } else if (isDateBefore(today, friend.offlineSince)) {
          friend.offlineSince = today;
        }
      }

      results.push({
        id: friend.id,
        name: friend.name,
        url: friend.url,
        status: result.success ? 'online' : 'offline',
      });

      if (friend.unidirectional === true) {
        unidirectionalFriends.push(friend);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const bidirectionalFriends = data.friends.filter(friend => friend.unidirectional !== true);
    data.friends = [...bidirectionalFriends, ...unidirectionalFriends];
    data.lastUpdated = getBuildTimestamp();

    const updatedContent = JSON.stringify(data, null, 2);
    fs.writeFileSync(FRIENDS_FILE, updatedContent);

    console.log('\nConnectivity check completed!');
    console.log(`Updated ${FRIENDS_FILE}`);

    const onlineCount = results.filter(r => r.status === 'online').length;
    const offlineCount = results.filter(r => r.status === 'offline').length;

    console.log(`\nSummary:`);
    console.log(`  Online: ${onlineCount}`);
    console.log(`  Offline: ${offlineCount}`);
    console.log(`  Total: ${results.length}`);

  } catch (error) {
    console.error('Failed to check friends connectivity:', error);
    process.exit(1);
  }
}

checkFriendsConnectivity();
