Feature: App creation

@skip_node_14
Scenario: I create a new app with Yarn
  Given I have a working directory
  When I create an app named MyApp with yarn as dependency manager
  Then I have an app named MyApp scaffolded from the template with yarn as dependency manager
  Then I can build the app
