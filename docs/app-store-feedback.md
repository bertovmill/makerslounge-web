Messages (1)

AppleToday 9:25 PM
Hello, 

Thank you for submitting the new app, Makerslounge, for review. We noticed some issues that require your attention. Please see below for additional information.

If you have any questions, we are here to help. Reply to this message in App Store Connect and let us know.

Review Environment
Submission ID: 10a9f621-b644-4060-b7b2-2a8293cdbe18
Review date: March 12, 2026
Review Device: iPhone 17 Pro Max and iPad Air 11-inch (M3)
Version reviewed: 1.0

Guideline 4.8 - Design - Login Services

Issue Description

The app uses a third-party login service, but does not appear to offer as an equivalent login option another login service with all of the following features:

- The login option limits data collection to the user’s name and email address.
- The login option allows users to keep their email address private from all parties as part of setting up their account.
- The login option does not collect interactions with the app for advertising purposes without consent. 

Next Steps

Revise the app to offer as an equivalent login option another login service that meets all of the above requirements.

If the app already includes another login service that meets all of the above requirements, reply to App Review in App Store Connect, identify which login service meets all of the requirements, and explain why it meets all of the requirements.

Note that Sign in with Apple is a login service that meets all the requirements specified in guideline 4.8.


Resources

Learn about the benefits of Sign in with Apple.
Guideline 4 - Design

Issue Description

Parts of the app's user interface were crowded, laid out, or displayed in a way that made it difficult to use the app when reviewed on iPad Air 11-inch (M3) running iPadOS 26.3.1.

Specifically, the app is not optimized to support the screen size or resolution of a iPad Air 11-inch (M3) - unable to see full screen to proceed to next step. 


Next Steps

To resolve this issue, revise the app to ensure that the content and controls on the screen are easy to read and interact with.

Note that users expect apps they download to function on all the devices where they are available. For example, apps that may be downloaded onto iPad devices should function as expected for iPad users. Learn more about supporting apps on compatible devices.

Resources

- Learn foundational design principles from Apple designers and the developer community.
- See documentation for the UIKit framework.
- Learn more about design requirements in guideline 4.
Guideline 2.1(a) - Performance
Issue Description

The app crashed during review. Apps that crash negatively impact users. 

Steps leading to crash:

1. Logged in
2. Tapped "home" 
3. Tried to use "take photo" feature, app crashed.

Review device details:

- Device type: iPad Air 11-inch (M3) 
- OS version: iPadOS 26.3.1

Next Steps

Test the app on supported devices to identify crashes and stability issues before resubmitting for review. Crash logs have been attached to help resolve this issue:

1. Fully symbolicate the crash report. See Adding Identifiable Symbol Names to a Crash Report.
2. Match the crash report to a common pattern. Based on the pattern, take specific actions to further investigate the crash. See Identifying the Cause of Common Crashes.
3. Once the root causes of the crash have been identified, make the appropriate changes to the binary to resolve the issue.
4. Test the app on a device to ensure that it runs as expected.

Note that users expect apps they download to function on all the devices where they are available. For example, apps that may be downloaded onto iPad devices should function as expected for iPad users. Learn more about supporting apps on compatible devices.

Resources

- For more information on crash reports, see Diagnosing Issues Using Crash Reports and Device Logs.
- For information about testing apps and preparing them for review, see Testing a Release Build.
- To learn about troubleshooting networking issues, see Networking Overview.


Guideline 1.2 - Safety - User-Generated Content

Issue Description

We found in our review that the app includes user-generated content but does not have all the required precautions. Apps with user-generated content must take specific steps to moderate content and prevent abusive behavior.

Next Steps

To resolve this issue, please revise the app to implement the following precautions:

- A mechanism for users to flag objectionable content
- A mechanism for users to block abusive users. Blocking should also notify the developer of the inappropriate content and should remove it from the user's feed instantly.
- The developer must act on objectionable content reports within 24 hours by removing the content and ejecting the user who provided the offending content

Resources

Learn more about our policies for user-generated content in guideline 1.2.
Guideline 3.1.1 - Business - Payments - In-App Purchase

Issue Description

We noticed that the app includes or accesses paid digital content, services, or functionality by means other than In-App Purchase, which is not appropriate for the App Store. Specifically: 

- The subscription plan can be purchased in the app using payment mechanisms other than In-App Purchase. 

Next Steps

The paid digital content, services, or subscriptions included in or accessed by the app must be available for purchase in the app using In-App Purchase. 

If you have any additional information to provide regarding the digital content and services in the app and how the guidelines apply to them, please reply to this message in App Store Connect and let us know. If there is information you'd like us to consider in our review of future submissions, please feel free to include it in the App Review Information section of App Store Connect. 

Resources

- See how to implement In-App Purchase with the StoreKit framework.
- Review step-by-step instructions for creating In-App Purchases in App Store Connect. 
- Learn more about business requirements in guideline 3.1.1.
- Learn more about submitting In-App Purchases and subscriptions to App Review.
Support
- Reply to this message in your preferred language if you need assistance. If you need additional support, use the Contact Us module.
- Consult with fellow developers and Apple engineers on the Apple Developer Forums.
- Provide feedback on this message and your review experience by completing a short survey.