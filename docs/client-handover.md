# HAV'ARC Field Service — Handover guide

This is the plan for making the app fully yours. Nothing here is technical work on your side: it is creating a few free accounts, clicking "Accept" in a few emails, and sending us a few details. We do everything else and we tell you when each step is done.

## What you will own

The app is made of four pieces. Each one lives in a separate online service, and each one will be moved into an account in your name.

| Piece | What it is | Service |
|---|---|---|
| **Database and logins** | Every job, customer, photo, PDF and user login lives here | Supabase |
| **Hosting** | The computer that shows the app at its web address | Vercel |
| **Source code** | The app's blueprints. If anyone ever works on the app, this is what they work on | GitHub |
| **Email sending** | Sends the PDFs to your office and the "reset password" emails | Brevo |

Once all four are in your accounts, nobody can switch the app off or lock you out. You can also give any developer, now or in ten years, access to work on it.

## Step 1 — Send us these details (one message is enough)

1. **Your work email address**, and your wife's, for the app logins. One login per person.
2. **The next invoice number** you want the app to use, and the prefix if you use one (for example "INV-1234" or just "1234").
3. **Who manages your website domain** havarcservices.com. The site was built by MediaLinkers; whoever has access there will need to add two small records for us. A name and an email is enough.
4. **Your decision on two plans** (see "Monthly costs" below).

When we have this, we create your logins, remove all the test jobs, and set the invoice numbering. Then we ask you to sign in with your own login and check that everything looks right.

## Step 2 — Create three free accounts

Use your **work email** for all three, so everything is in one place. Just sign up; you do not need to do anything inside the services.

1. **supabase.com** → "Start your project" → sign up with email. During sign-up it asks for an "organization name": type **HAV'ARC**.
2. **vercel.com** → "Sign Up" → choose "Hobby" for now → continue with email.
3. **github.com** → "Sign up" → email and password.

Write the three passwords down somewhere safe, or use the password manager on your phone. These accounts are the keys to your app.

Then send us one message: "the three accounts are created". If a service asks you to confirm your email, click the link in that email first.

## Step 3 — Accept the transfers

We will send a transfer request from each service to your account. You will get three emails, one from Supabase, one from Vercel, one from GitHub, each with an **Accept** button or link. Click Accept on each one.

That is the whole step. After this, the database, the hosting and the source code are in your name. The app keeps working during the transfer; nothing changes for you or your wife on the phone.

## Step 4 — Email from your own domain

Right now the PDFs and password emails are sent from a temporary address. To send them as **@havarcservices.com**:

1. Go to **brevo.com** → "Sign up free" → use your work email. Send us a message when it is done.
2. We prepare **two DNS records** (two short lines of text) and send them to the person who manages your website. They paste them in; it takes them a few minutes.
3. We connect the app to your Brevo account. From then on, every email the app sends comes from your domain.

Optional, same time: the app can get its own address, for example **app.havarcservices.com**, instead of havarc.vercel.app. That is one more record for the same person. Tell us if you want it and which name you like.

## Step 5 — Keep us as helpers (recommended, and you can undo it any time)

After the transfer we no longer have access to anything. If you want us to maintain the app, fix something, or build the next features, invite our developer as a member in each service. The email to invite is **ozymandiuz@gmail.com** (Yaroslav, the developer of the app). It is "Members → Invite → paste the email" in all three services; we will send you the exact clicks for each one when we get there. You can remove us the same way at any time.

## Step 6 — Final check on your phone

Sign in with your new login, do one real job start to finish, and check that the two PDFs arrive in your office inbox. If that works, the handover is complete.

## Monthly costs

Everything runs on free plans today. Two things to decide:

- **Vercel (hosting).** The free "Hobby" plan is for personal projects only; Vercel's rules do not allow business use. The **Pro plan is $20 a month** and is the right one for a company. We recommend switching to Pro right after the transfer. You do it in your Vercel account: Settings → Billing → Upgrade, with a card.
- **Supabase (database).** The free plan is fine for two users and today's amount of work. The **Pro plan is $25 a month** and adds daily backups and support. Not required now; you can switch later at any time.

Brevo and GitHub stay free.

## Adding and removing users

There is no "sign up" button in the app on purpose: only people you add can get in. Everyone you add sees and can change everything (jobs, invoices, settings), so add only people you trust with the business paperwork.

**The easy way:** message us the person's name and email, and we do it the same day. This works as long as we are kept as helpers (Step 5).

**Doing it yourself** takes about two minutes:

1. Go to **supabase.com/dashboard** and sign in with your work email.
2. Click the **HAVARC** project.
3. In the left menu click **Authentication**, then **Users**.
4. Click the green **Add user** button (top right) → **Create new user**.
5. Type the person's email. In the password box type anything, for example the person's name and today's date; they will never use it. Tick **Auto Confirm User**. Click **Create user**.
6. Tell the person: open the app, tap **Forgot password?**, enter your email, and set your own password from the email that arrives. Then sign in.

**Removing a person:**

1. Same place: **Authentication → Users**.
2. Find the person in the list, click the **⋯** at the end of their row → **Delete user** → confirm.

They are locked out immediately, on every device. All the jobs they entered stay in the system.

## Things to keep safe

- The passwords for the three accounts (Supabase, Vercel, GitHub) and for Brevo.
- The card you put on Vercel for the Pro plan.
- This document. Any developer you hire in the future will understand the setup from it.
