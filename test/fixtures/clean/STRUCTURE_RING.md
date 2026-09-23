# Structure

```clojure
{:RingLog/entry {:does "raise an event into its type's ring"
                 :in #{:payload}
                 :out :none
                 :flow (-> (:step-1 {:calls RingOf :out :ring})
                           (:step-2 {:calls MakeRoom :out :none})
                           (:step-3 {:calls PlaceNewest :out :none}))}
 :RingLog/data {:payload {:type EventPayload :as payload :lives :external :holds "what the caller raised"}
                :ring {:type EventRing :as ring :lives RaiseEntry :holds "the circle of this type"}}}
```

# Parts

```clojure
[{:part :core :writes #{"RingLog.cs"} :carries #{RingOf MakeRoom} :after #{} :confidence 60}
 {:part :place :writes #{"RingPlace.cs"} :carries #{PlaceNewest} :after #{:core} :confidence 40}]
```
