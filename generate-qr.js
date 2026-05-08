const QRCode = require('qrcode');
const fs = require('fs');

const YOUR_APP_URL = process.env.APP_URL || 'https://your-taskmanager-app.vercel.app';

async function generateQR() {
  try {
    const outputPath = 'taskmanager-qr.png';

    const qrImage = await QRCode.toFile(outputPath, YOUR_APP_URL, {
      type: 'png',
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    console.log('\n========================================');
    console.log('QR Code Generated Successfully!');
    console.log('========================================');
    console.log('File: taskmanager-qr.png');
    console.log('URL:', YOUR_APP_URL);
    console.log('\nAnyone who scans this QR will go directly');
    console.log('to your Task Manager app!\n');
  } catch (err) {
    console.error('Error generating QR:', err);
  }
}

generateQR();