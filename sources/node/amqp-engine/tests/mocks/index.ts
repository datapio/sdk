import mock from 'mock-require'
import amqp from './amqp'

mock('amqplib', amqp)
