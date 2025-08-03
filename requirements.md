Product Requirements Document (PRD): HomeBuddy Core App System

📌 Overview

HomeBuddy is a simple, friendly app that helps busy families stay organized, connected, and on top of daily life. It’s made for real households — parents, kids, grandparents, and even flatmates — who want to manage routines, share responsibilities, and never miss a beat.

🎯 Who It's For

Multigenerational families (parents, kids, grandparents)

Blended or split households

Flatmates and co-living groups

Caregivers or guardians managing multiple people

Anyone juggling multiple homes or households

HomeBuddy is intentionally inclusive, easy to use, and built to adapt to all family structures.

🚀 What We're Building

A mobile app (iOS + Android) and companion web app that supports:

Shared calendars, to-dos, chores, and household tasks

Push notifications and reminders

Role-based access per household

Multiple household management under one login

Invite-based onboarding for family members

Personalized scheduling and alert systems

The app’s goal is to simplify daily life and improve collaboration across everyone in the household.

💡 Why We're Doing It

Most family management tools are either too complex, too business-like, or too fragmented (requiring multiple apps). HomeBuddy is built:

For simplicity and clarity

To centralize daily family life

To improve communication and reduce mental load

To empower each member to contribute — from toddlers to grandparents

🧩 Core Features

✅ Shared Calendars

Schedule events, pickups, and family activities

Viewable by all household members

✅ Chores & Task Lists

Assignable by room or subject

Trackable with due dates, streaks, and completion status

✅ To-Dos & Routines

Daily, weekly, and one-off tasks

Create recurring reminders for wakeups, medications, etc.

✅ Meal Planner & Shopping List

Plan and share meals across the week

Build collaborative shopping lists

✅ Celebrations & Special Dates

Birthdays, anniversaries, and milestones

Add gift ideas and get early reminders

✅ Household Roles

Each user has a role: Admin, Adult, Teen, Child

Admins control settings and permissions

Adults can manage features

Teens/Children can view and complete tasks

✅ Multi-Household Support

Users can be part of more than one household (e.g., blended families)

Different roles and preferences per household

Switch between households easily

✅ Invite System

Households are created by Admins

Users join via invite link or code

Roles are set during onboarding or edited later

✅ Push Notifications & Smart Reminders

Scheduled reminders for wake-ups, events, chores, etc.

One-off and recurring alerts

Notifications personalized by household and user role

Works seamlessly on iOS and Android

Optional quiet hours and DND settings

🧠 Design & UX Philosophy

Simple, friendly, and fun — even kids and grandparents can use it

Visual clarity: large buttons, color-coded lists, clean calendar views

Designed mobile-first, with support for tablets and desktop web app

Ability to have different themes per person

📱 Technical Specifications

1. Tech Stack

Frontend: React Native (Expo), React (Web)

Backend: Supabase (authentication, database, RLS)

**Tracking **: Posthog 

Push Notifications:

Android: Firebase Cloud Messaging (FCM)

iOS: Apple Push Notification Service (APNs)

Unified interface using Expo Push Notifications

2. Component Architecture

AuthStack: Login, Signup, Invite Code

MainStack:

Dashboard (Calendar view)

Tasks (Chores, To-Dos)

Reminders

Shopping List

Celebrations

Settings (household + user-level)

3. Web App

Responsive version for desktop/tablet use

All functionality mirrors the mobile version

🔐 Security Considerations

All data encrypted in transit and at rest

Supabase Row-Level Security (RLS) enforces per-user and per-household access

API keys securely stored and access-controlled

Secure login with OTP/email authentication

Privacy: no tracking of location or biometric data

🗂️ Development Phases

Phase 1: MVP Core System (Est. 2 weeks)

Supabase project setup

User authentication and invite flow

Household creation and member roles

Basic calendar and task list UI

Push notification integration for Android & iOS

Web app prototype with auth and calendar

Phase 2: Feature Expansion (Est. 2–3 weeks)

Recurring reminders and routines

Chore assignments by room/category

Celebration tracking and tagging

User-specific notification preferences

Phase 3: Cross-Household UX & Data (Est. 1–2 weeks)

Add/manage multiple households per user

Role and access logic per household

Data isolation and settings persistence

Phase 4: UI/UX Polish & Testing (Est. 1 week)

UI refinement across screens

Accessibility improvements

App store assets and build optimization

Global error boundaries and crash handling

⚠️ Risk Management

Push Delivery Failures: Implement retries and fallback messaging

Supabase Misconfigurations: Automated testing for RLS and roles

Cross-Household Confusion: Clear onboarding and household switching UX

Slow Push Delivery: Timeout states and in-app fallback reminders

✅ Success Looks Like:

A household signs up and adds all members within minutes

Everyone understands their role and gets reminders that matter

People actually use the app daily — not because they have to, but because it makes life easier

📌 Appendix

Supabase Docs: https://supabase.com/docs

Firebase Cloud Messaging: https://firebase.google.com/docs/cloud-messaging

Apple Push Notifications: https://developer.apple.com/notifications/

Expo Push: https://docs.expo.dev/push-notifications/intro/