

myApp.controller('LoginCtrl', ['$scope', '$http', '$cookies', function($scope, $http, $cookies){
  //SCOPE VARS
  $scope.createGroupShow = true;
  $scope.invitePeopleShow = false;
  $scope.emailsToInvite = [];
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
        $scope.userId = result.data._id;
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
      teams: []
    };
    var newUser = {
      group: $scope.groupName
    };
    $http({
      method: 'POST',
      url: '/api/group',
      data: newGroup})
      .then(function(result) {
        console.log("about to put user");
        console.log($scope.userId);
        $http({
          method: 'PUT',
          ///api/usergroup/:id
          url: '/api/usergroup/' + $scope.userId,
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
          $scope.emailsToInvite.push($scope.emailToInvite);
          $scope.emailToInvite = "";
        }
      }
    }
  };
  $scope.removeInvite = function(index) {
    $scope.emailsToInvite.splice(index, 1);
  };
  $scope.sendInvites = function() {
    alert("Invites have been sent!");
    $scope.emailsToInvite = [];
    $scope.emailToInvite = "";
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