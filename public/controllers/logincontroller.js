myApp.config(['$locationProvider', function($locationProvider){
  //$locationProvider.html5Mode(true); 
  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  });
}]);

myApp.controller('LoginCtrl', ['$scope', '$http', '$cookies', '$location', function($scope, $http, $cookies, $location){
  //SCOPE VARS
  $scope.createGroupShow = true;
  $scope.invitePeopleShow = false;
  $scope.emailsToInvite = [];
  //Check Query String for invite function
  console.log($location.search().compid);
  console.log($location.search().uuid);
  //var groupid = req.query.compid;
  //var uuid = req.query.uuid;
  $scope.getInviteInfo = function() {
    $scope.groupid = $location.search().compid;
    $scope.uuid = $location.search().uuid;
    $http({
      method: 'GET',
      url: '/api/group/' + $scope.groupid
    }).then(function(result){
      console.log(result);
      console.log(result.data);
      $scope.groupName = result.data.name;
    });
  }
  //HELPER FUNCTIONS
  function validateEmail(email) {
    var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    if (!filter.test(email)) {
      alert('Please provide a valid email address');
      return false;
    } else {
      return true;
    }
  }
  function getUserIfCookie() {
    if ($cookies.get('email')) {
      var email = $cookies.get('email');
      console.log(email);
      $http({
        method: 'GET',
        url: '/api/user/' + email
      }).then(function(result){
        console.log("IN getUserIfCookie");
        console.log(result.data);
        $scope.currentUserId = result.data._id;
        $scope.currentFirstName = result.data.firstName;
        $scope.currentLastName = result.data.lastName;
        $scope.currentEmail = result.data.email;
        $scope.currentGroup = result.data.group;
      });
    }    
  }
  getUserIfCookie();
  //SCOPE FUNCTIONS
  $scope.signIn = function(){
    var existingUser = {
      email: $scope.email,
      password: $scope.password
    };
    $http({
      method: 'POST',
      url: '/api/login',
      data: existingUser})
      .then(function(response){
        if (response.status == 200) {
          //Error status
          console.log(response.data.message);
          $scope.errorMessage = response.data.message;
        } else if (response.status == 201) {
          //Good response
          if (response.data.auth == true) {
            $cookies.put('token', response.data.token);
            $cookies.put('email', response.data.email);
            $cookies.put('firstName', response.data.firstName);
            $cookies.put('lastName', response.data.lastName);
            $scope.successMessage = "User signed in. Redirecting.";
            window.location.href = '/';
          }
          console.log("Token MOTHERFUCKER:");
          console.log(response.data.token);
        } else {
          //Some other Error
          console.log(response.data.message);
          $scope.errorMessage = response.data.message;
        }
      })
  };
  $scope.signUp = function(){
    console.log("in signup function");
    var newUser = {
      firstName: $scope.firstName,
      lastName: $scope.lastName,
      email: $scope.newEmail,
      password: $scope.newPassword
    };
    $http({
      method: 'POST',
      url: '/api/register', 
      data: newUser})
      .then(function(response){
        if (response.status == 200) {
          console.log(response.data.message);
          $scope.errorMessage = response.data.message;
        } else if (response.status == 201) {
          console.log("Response from login coming next");
          console.log(response);
          if (response.data.auth == true) {
            $cookies.put('token', response.data.token);
            $cookies.put('email', response.data.email);
            $cookies.put('firstName', response.data.firstName);
            $cookies.put('lastName', response.data.lastName);
            $scope.successMessage = "User created. Redirecting.";
            window.location.href = '/register';
          }
          //NEW USER CREATED
          //Do something
        }
        else {
          console.log(response.data.message);
          $scope.errorMessage = response.data.message;
        }
    });
  };
  $scope.signOut = function() {
    console.log("in sign out function");
    $http({
      method: 'GET',
      url: '/api/logout'})
      .then(function(response){
        console.log("Got response from api/logout");
        if (response.status == 200) {
          console.log("Response was good");
          $cookies.remove('token');
          $cookies.remove('email');
          $cookies.remove('firstName');
          $cookies.remove('lastName');
          //Redirect to login screen
          window.location.href = '/login';
        } else {
          //SOME SORT OF ERROR HANDLING WHAT THE FUCK
        }
      });
  };
  //createGroup() addInvite() sendInvites()
  $scope.createGroup = function() {
    var email = $cookies.get('email');
    var newGroup = {
      name: $scope.groupName,
      admins: [email],
      users: [email],
      projects: [],
      teams: [],
      invitedEmails: [],
      inviteIds: []
    };
    var newUser = {
      group: $scope.groupName
    };
    $http({
      method: 'POST',
      url: '/api/group',
      data: newGroup})
      .then(function(result) {
        console.log(result);
        console.log(result.data._id);
        console.log(result.data);
        $scope.currentCompanyId = result.data._id;
        console.log("about to put user");
        console.log($scope.currentUserId);
        console.log($scope.currentCompanyId);
        $http({
          method: 'PUT',
          ///api/usergroup/:id
          url: '/api/usergroup/' + $scope.currentUserId,
          data: newUser
        })
        .then(function(res){
          $scope.createGroupShow = false;
          $scope.invitePeopleShow = true;
        });
      });    
  };
  $scope.addInvite = function() {
    if ($scope.emailToInvite) {
      if ($scope.emailToInvite != "") {
        if (validateEmail($scope.emailToInvite)) {
          if($scope.emailsToInvite.length < 20) {
            $scope.emailsToInvite.push($scope.emailToInvite);
            $scope.emailToInvite = "";
          } else {
            $scope.errorMessage = "At most 20 invitations can be sent at one time. You can send more tomorrow, or for enterprise help, contact our support.";
          }
        }
      }
    }
  };
  $scope.signUpFromInvite = function() {
    var newUser = {
      firstName: $scope.firstName,
      lastName: $scope.lastName,
      email: $scope.newEmail,
      password: $scope.newPassword,
      group: $scope.groupName,
      uuid: $scope.uuid,
      groupid: $scope.groupid
    };
    $http({
      method: 'POST',
      url: '/api/registerfrominvite',
      data: newUser})
      .then(function(response){
        console.log("IN POST IN SIGNUPFROMINVITE");
        console.log(response.data);
        if (response.status == 200) {
          console.log(response.data.message);
          $scope.errorMessage = response.data.message;
        } else if (response.status == 201) {
          console.log("Response from login coming next");
          console.log(response);
          if (response.data.auth == true) {
            $cookies.put('token', response.data.token);
            $cookies.put('email', response.data.email);
            $cookies.put('firstName', response.data.firstName);
            $cookies.put('lastName', response.data.lastName);
            $scope.successMessage = "User created. Redirecting.";
            window.location.href = '/';
          }
          //NEW USER CREATED
          //Do something
        }
        else {
          console.log(response.data.message);
          $scope.errorMessage = response.data.message;
        }
      });
  };
  $scope.removeInvite = function(index) {
    $scope.emailsToInvite.splice(index, 1);
  };
  $scope.sendInvites = function() {    
    //var inviteId = uuidv4();
    var invites = {
      emails: $scope.emailsToInvite,
      fromName: $scope.currentFirstName + " " + $scope.currentLastName,
      companyId: $scope.currentCompanyId
    };
    $http({
      method: 'POST',
      url: '/api/invite',
      data: invites
    })
    .then(function(res) {
      alert("Invites have been sent!");
      $scope.emailsToInvite = [];
      $scope.emailToInvite = "";
      window.location.href = "/";
    });    
  };
  $scope.protectedRoute = function() {
    $http({
      method: 'GET',
      url: '/me',
      headers: {
        'x-access-token': $cookies.get('token') 
      }});
  };
}]);