# Feature User Guide
## Feature: Create Teaching Assistant account

### Description
Allows user to create an account type of teaching assistant, in addition to the default instructor and student account types.

### How to test feature
- From the home page of NodeBB, go to the register account page
- Fill out the username, password, confirm password
- Under account type, select “Teaching Assistant” 
![image](https://user-images.githubusercontent.com/45646252/222327174-68440aa3-f5f5-43fd-aea5-5edf6c6c9292.png)
- Create account
- Account should be created successfully

### Automated Tests
- The test for this can be found in test/authentication.js
- It tests whether the user can create an account type with teaching assistant, which should be sufficient as being able to create a teaching assistant account is what was intended by this feature
