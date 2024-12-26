/* eslint-disable no-console */
import chalk from 'chalk'

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export class Logger {
  private level: LogLevel
  private context: string
  /** TODO: 可以使用其他的 debug 日志库 */
  private Debugger = null
  /** 全局兜底：是否是隐式log */
  private isImplicit: boolean

  constructor(level: LogLevel = LogLevel.INFO, context: string = 'Plugin', isImplicit = false) {
    this.level = level
    this.context = context
    this.isImplicit = isImplicit
  }

  private log(level: LogLevel, message: string, isImplicit?: boolean) {
    if (this.shouldLog(level)) {
      const coloredMessage = this.getColoredMessage(level, message)
      if (isImplicit ?? this.isImplicit) {
        // TODO: 相关的隐式log，需要通过外部环境变量启用
        // 此处暂时不显示
      }
      else {
        const c = 69
        const colorCode = `\u001B[3${c < 8 ? c : `8;5;${c}`};1m`
        console.log(`  ${chalk(`${colorCode}${this.context}`)} ${coloredMessage}`)
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR]
    return levels.indexOf(level) >= levels.indexOf(this.level)
  }

  private getColoredMessage(level: LogLevel, message: string): string {
    switch (level) {
      case LogLevel.DEBUG:
        return chalk.blue(`[${level}] ${message}`)
      case LogLevel.INFO:
        return chalk.green(`[${level}] ${message}`)
      case LogLevel.WARN:
        return chalk.yellow(`[${level}] ${message}`)
      case LogLevel.ERROR:
        return chalk.red(`[${level}] ${message}`)
      default:
        return message
    }
  }

  debug(message: string, isImplicit?: boolean) {
    this.log(LogLevel.DEBUG, message, isImplicit)
  }

  info(message: string, isImplicit?: boolean) {
    this.log(LogLevel.INFO, message, isImplicit)
  }

  warn(message: string, isImplicit?: boolean) {
    this.log(LogLevel.WARN, message, isImplicit)
  }

  error(message: string, isImplicit?: boolean) {
    this.log(LogLevel.ERROR, message, isImplicit)
  }
}

export const logger = new Logger(LogLevel.INFO, 'uni-ku:bundle-optimizer')
