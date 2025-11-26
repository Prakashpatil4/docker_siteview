const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { BigQuery } = require('@google-cloud/bigquery');
const emailjs = require('@emailjs/nodejs');

const SCOPES = [
  'https://www.googleapis.com/auth/bigquery',
  'https://www.googleapis.com/auth/drive.readonly'
];
const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

const bigquery = new BigQuery({
  keyFilename: './src/keys.json',
  projectId: 'elevate360-poc',
  scopes: SCOPES,
});

const EMAILJS_SERVICE_ID = 'service_kj4vmwp';
const EMAILJS_TEMPLATE_ID = 'template_y6uiu37';
const EMAILJS_PUBLIC_KEY = 'TSj3bq6Ew_TjrTSeO';
const EMAILJS_PRIVATE_KEY = 'i_p_JgGTUlLGxIupkJSYr'; 

emailjs.init({
  publicKey: EMAILJS_PUBLIC_KEY,
  privateKey: EMAILJS_PRIVATE_KEY,
});

app.get('/api/sdr-by-specialization', async (req, res) => {
  const { startDate, endDate, businessLine, site } = req.query;
  let filters = [
    "string_field_18 = 'TRUE'",
    "PARSE_DATE('%m/%d/%Y', string_field_4) BETWEEN @startDate AND @endDate"
  ];
  const params = { startDate, endDate };
  if (site && site !== 'Select') {
    filters.push("TRIM(string_field_14) = @site");
    params.site = site.trim();
  }
  if (businessLine && businessLine !== 'Select') {
    filters.push("string_field_5 = @businessLine");
    params.businessLine = businessLine.trim();
  }
  const whereClause = filters.join(' AND ');
  const query = `
    SELECT
      string_field_10 AS specialization,
      COUNT(*) AS sdr_count 
    FROM
      \`elevate360-poc.hyd_core_data.core-metrics\`
    WHERE
      ${whereClause}
    GROUP BY 
      string_field_10
    ORDER BY
      sdr_count DESC  
  `;
  try {
    const [rows] = await bigquery.query({ query, params });
    res.json(rows);
  } catch (err) {
    console.error('BigQuery Error:', err);
    res.status(500).send('Query Failed');
  }
});

app.get('/api/escalation-rate', async (req, res) => {
  const { startDate, endDate, businessLine, site } = req.query;
  let filters = [
    "string_field_18 = 'TRUE'",
    "PARSE_DATE('%m/%d/%Y', string_field_4) BETWEEN @startDate AND @endDate"
  ];
  const params = { startDate, endDate };
  if (site && site !== 'Select') {
    filters.push("TRIM(string_field_14) = @site");
    params.site = site.trim();
  }
  if (businessLine && businessLine !== 'Select') {
    filters.push("string_field_5 = @businessLine");
    params.businessLine = businessLine.trim();
  }
  const whereClause = filters.join(' AND ');
  const query = `
    SELECT
      COUNTIF(string_field_19 = 'TRUE') AS total_escalation,
      COUNT(*) AS total_closed_volume,
      SAFE_DIVIDE(COUNTIF(string_field_19 = 'TRUE'), COUNT(*)) AS escalation_rate
    FROM
      \`elevate360-poc.hyd_core_data.core-metrics\`
    WHERE
      ${whereClause}
  `;
  try {
    const [rows] = await bigquery.query({ query, params });
    res.json(rows[0]);
  } catch (err) {
    console.error('BigQuery Error:', err);
    res.status(500).send('Query Failed');
  }
});

app.post('/api/send-announcement', async (req, res) => {
  const { specialization, message, from_email } = req.body;

  // 4. Build BigQuery query to get Owner_ldap
  let queryOptions = {
    query: `
      SELECT DISTINCT string_field_12 AS owner_ldap
      FROM \`elevate360-poc.hyd_core_data.core-metrics\`
      WHERE string_field_10 = @specialization
    `,
    params: { specialization: specialization }
  };

  // If 'all' is selected, get all owners
  if (specialization === 'all') {
    queryOptions = {
      query: `
        SELECT DISTINCT string_field_12 AS owner_ldap
        FROM \`elevate360-poc.hyd_core_data.core-metrics\`
      `
  
    };
  }

  try {
    // 5. Get LDAP list from BigQuery
    const [rows] = await bigquery.query(queryOptions);

    if (rows.length === 0) {
      return res.status(404).send({ error: 'No recipients found for this specialization.' });
    }

    // 6. ❗ IMPORTANT: Convert LDAP usernames to full email addresses
    //    You must add your company's email domain here.
    const recipientEmails = rows
      .map(row => `${row.owner_ldap}@google.com`) 
      .join(',');

    console.log('Sending to:', recipientEmails);

    // 7. Prepare variables for the EmailJS template
    const templateParams = {
      to_email: recipientEmails,  // This will go to the 'To', 'CC', or 'BCC' field in your template
      message: message,           // The announcement message
      reply_to: from_email,       // The mail provided in the website that wil be reflected to viewer
      from_name: from_email,      // "from" name for the viewer of the mail
    };

    // 8. Send the email
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    res.status(200).send({ success: true, message: 'Announcement sent!' });

  } catch (err) {
    console.error('Error:', err);
    res.status(500).send({ error: 'Failed to send announcement.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});