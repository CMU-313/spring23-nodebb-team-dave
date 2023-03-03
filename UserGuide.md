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

## Feature: Endorsing comments
### Description
Allows instructors and Teaching Assistants to endorse posts for the content they consider as valuable and worthy to take a look. In addition, it allows an easy way for student answers to be recognized by instructors so that instructors do not need to do any extra work when answering questions, and other students can trust the answers given by other students. 

### How to test feature
- From the home page of NodeBB, go to the register account page;
- Register instructor account;
- Go to a certain Post or Create one;
- There would be an “Endorse” or “Unendorse” button located on the right corner of each post
![image]https://i.imgur.com/kjsJYad.png

- Click on the button and see the name of the button changes as well as prompts about endorsement;
![image]https://i.imgur.com/zxa9FDO.png

- Click on the button should reverse the state, i.e. clicking “Unendorse” gives “Endorse” with no prompts back;
- Refreshing the page or Using another account should see the same endorsement information for each post;

### Automated Tests
- The test for this can be found in test/posts.js
- The test checks whether the api writes functions called for endorsing or unendorsing posts correctly modify the attribute hasEndorsed, which consequently decides the endorsed field in API.
- These tests are sufficient for checking the consistency between the data stored in the database and the intended endorse actions. Therefore, passing these tests indicate that the backend is correctly handled as design, and the frontend button display and prompt can be easily tested through direct interaction with the webpage.