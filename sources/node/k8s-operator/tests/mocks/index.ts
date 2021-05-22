import * as testWorld from './test-world'
import mock from 'mock-require'

mock('test!world', testWorld)

import * as http from './http'
import * as https from './https'
import * as fs from './fs'
import * as terminus from './terminus'
import * as kubernetesClient from './kubernetes-client'
import backendRequest from './kubernetes-client-backend-request'
import * as apolloServer from './apollo-server'
import express from './express'

// import it so it depends on real modules and not our mocks
import casual from 'casual'


mock('http', http)
mock('https', https)
mock('fs', fs)
mock('@godaddy/terminus', terminus)
mock('kubernetes-client', kubernetesClient)
mock('kubernetes-client/backends/request', backendRequest)
mock('apollo-server-express', apolloServer)
mock('express', express)
mock('casual', casual)
